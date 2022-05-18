import { unstable_batchedUpdates as batchUpdates } from 'react-dom';
import create from 'zustand';
import produce, { setAutoFreeze } from 'immer';
import { BigIntOrderedMap, decToUd, udToDec, unixToDa } from '@urbit/api';
import { Poke, SubscriptionInterface } from '@urbit/http-api';
import bigInt, { BigInteger } from 'big-integer';
import { useCallback, useMemo } from 'react';
import {
  Chat,
  ChatDiff,
  ChatMemo,
  ChatPerm,
  ChatUpdate,
  ChatWhom,
  ChatWrit,
  ChatWrits,
  DmAction,
  Pact,
  WritDelta,
  WritDiff,
} from '../../types/chat';
import api from '../../api';
import { whomIsDm } from '../../logic/utils';
import makeWritsStore from './writs';
import { ChatState } from './type';

setAutoFreeze(false);

interface ChatApi {
  newest: (whom: string, count: number) => Promise<ChatWrit[]>;
  subscribe: (whom: string, opts: SubscriptionInterface) => Promise<number>;
  delMessage: (whom: string, time: string) => Promise<number>;
}

function chatAction(whom: string, diff: ChatDiff) {
  return {
    app: 'chat',
    mark: 'chat-action',
    json: {
      whom,
      update: {
        time: '',
        diff,
      },
    },
  };
}

function chatWritDiff(whom: string, id: string, delta: WritDelta) {
  return chatAction(whom, {
    writs: {
      id,
      delta,
    },
  });
}

function makeId() {
  return `${window.our}/${decToUd(unixToDa(Date.now()).toString())}`;
}

function dmAction(
  ship: string,
  delta: WritDelta,
  id = makeId()
): Poke<DmAction> {
  console.log(ship, id, delta);
  return {
    app: 'chat',
    mark: 'dm-action',
    json: {
      ship,
      diff: {
        id,
        delta,
      },
    },
  };
}

const chatApi: ChatApi = {
  subscribe: (whom, opts) =>
    api.subscribe({ app: 'chat', path: `/chat/${whom}/ui`, ...opts }),
  newest: (whom, count) =>
    api.scry({
      app: 'chat',
      path: `/chat/${whom}/writs/newest/${count}`,
    }),
  delMessage: (whom, idx) => api.poke(chatWritDiff(whom, idx, { del: null })),
};

export const useChatState = create<ChatState>((set, get) => ({
  set: (fn) => {
    set(produce(get(), fn));
  },
  batchSet: (fn) => {
    batchUpdates(() => {
      get().set(fn);
    });
  },
  pacts: {},
  dms: {},
  flags: [] as string[],
  fetchFlags: async () => {
    const flags = await api.scry<string[]>({
      app: 'chat',
      path: '/chat',
    });
    get().batchSet((draft) => {
      draft.flags = flags;
    });
  },
  fetchDms: async () => {
    const dms = await api.scry<string[]>({
      app: 'chat',
      path: '/dm',
    });
    get().batchSet((draft) => {
      dms.forEach((ship) => {
        const chat = {
          writs: new BigIntOrderedMap<ChatWrit>(),
          perms: {
            writers: [],
          },
          draft: {
            inline: [],
            block: [],
          },
        };
        draft.dms[ship] = chat;
      });
    });
  },
  chats: {},
  joinChat: async (whom) => {
    await api.poke({
      app: 'chat',
      mark: 'whom',
      json: whom,
    });
    await get().fetchFlags();
  },
  sendMessage: (whom, memo) => {
    const isDM = whomIsDm(whom);
    const diff = { add: memo };
    if (isDM) {
      api.poke(dmAction(whom, { add: memo }));
    } else {
      const id = makeId();
      console.log(id, memo);
      api.poke(chatWritDiff(whom, id, diff));
    }
  },
  delMessage: (whom, id) => {
    const isDM = whomIsDm(whom);
    const diff = { del: null };
    if (isDM) {
      api.poke(dmAction(whom, diff, id));
    } else {
      api.poke(chatWritDiff(whom, id, diff));
    }
  },
  create: async (req) => {
    await api.poke({
      app: 'chat',
      mark: 'chat-create',
      json: req,
    });
  },
  addSects: async (whom, sects) => {
    await api.poke(chatAction(whom, { 'add-sects': sects }));
  },
  initialize: async (whom: string) => {
    const perms = await api.scry<ChatPerm>({
      app: 'chat',
      path: `/chat/${whom}/perm`,
    });
    get().batchSet((draft) => {
      const chat = {
        writs: new BigIntOrderedMap<ChatWrit>(),
        perms,
        draft: { block: [], inline: [] },
      };
      draft.chats[whom] = chat;
    });
    await makeWritsStore(
      whom,
      get,
      `/chat/${whom}/writs`,
      `/chat/${whom}/ui/writs`
    ).initialize();
  },
  draft: async (whom, draft) => {},
  initializeDm: async (ship: string) => {
    const perms = {
      writers: [],
    };
    get().batchSet((draft) => {
      const chat = { writs: new BigIntOrderedMap<ChatWrit>(), perms };
    });
    await makeWritsStore(
      ship,
      get,
      `/dm/${ship}/writs`,
      `/dm/${ship}/ui`
    ).initialize();
  },
}));

export function useMessagesForChat(whom: string) {
  const def = useMemo(() => new BigIntOrderedMap<ChatWrit>(), []);
  return useChatState(
    useCallback((s) => s.pacts[whom]?.writs || def, [whom, def])
  );
}

const defaultPerms = {
  writers: [],
};

export function useChatPerms(whom: string) {
  return useChatState(
    useCallback((s) => s.chats[whom]?.perms || defaultPerms, [whom])
  );
}

export function useChatIsJoined(whom: string) {
  return useChatState(useCallback((s) => s.flags.includes(whom), [whom]));
}

const selDmList = (s: ChatState) => Object.keys(s.dms);

export function useDmList() {
  return useChatState(selDmList);
}

export function useDmMessages(ship: string) {
  return useMessagesForChat(ship);
}

export function usePact(whom: string) {
  return useChatState(useCallback((s) => s.pacts[whom], [whom]));
}

function getPact(pact: Pact, id: string) {
  const time = pact.index[id];
  if (!time) {
    return undefined;
  }
  return pact.writs.get(time);
}

export function useReplies(whom: string, id: string) {
  const pact = usePact(whom);
  return useMemo(() => {
    const { writs, index } = pact;
    const time = index[id];
    if (!time) {
      return new BigIntOrderedMap<ChatWrit>();
    }
    const message = writs.get(time);
    const replies = (message?.seal?.replied || ([] as string[]))
      .map((r: string) => {
        const t = pact.index[r];
        const writ = t && writs.get(t);
        return t && writ ? ([t, writ] as const) : undefined;
      })
      .filter((r: unknown): r is [BigInteger, ChatWrit] => !!r);
    return new BigIntOrderedMap<ChatWrit>().gas(replies);
  }, [pact, id]);
}

export function useWrit(whom: string, id: string) {
  return useChatState(
    useCallback(
      (s) => {
        const pact = s.pacts[whom];
        if (!pact) {
          return undefined;
        }
        const time = pact.index[id];
        if (!time) {
          return undefined;
        }
        return [time, pact.writs.get(time)] as const;
      },
      [whom, id]
    )
  );
}

export function useChatDraft(whom: string) {
  return {
    inline: [],
    block: [],
  };
}
