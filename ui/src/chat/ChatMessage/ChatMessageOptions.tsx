import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useCopyToClipboard } from 'usehooks-ts';
import { useRouteGroup } from '@/state/groups';
import { useChatState } from '@/state/chat';
import { ChatWrit } from '@/types/chat';
import IconButton from '@/components/IconButton';
import BubbleIcon from '@/components/icons/BubbleIcon';
import EllipsisIcon from '@/components/icons/EllipsisIcon';
import FaceIcon from '@/components/icons/FaceIcon';
import HashIcon from '@/components/icons/HashIcon';
import ShareIcon from '@/components/icons/ShareIcon';
import XIcon from '@/components/icons/XIcon';
import { useChatStore } from '@/chat/useChatStore';
import CopyIcon from '@/components/icons/CopyIcon';
import CheckIcon from '@/components/icons/CheckIcon';

export default function ChatMessageOptions(props: {
  whom: string;
  writ: ChatWrit;
  hideReply?: boolean;
}) {
  const { whom, writ, hideReply } = props;
  const groupFlag = useRouteGroup();
  const [_copied, doCopy] = useCopyToClipboard();
  const [justCopied, setJustCopied] = useState(false);

  const onDelete = () => {
    useChatState.getState().delMessage(whom, writ.seal.id);
  };

  const onCopy = useCallback(() => {
    doCopy(`/1/chan/chat/${whom}/msg/${writ.seal.id}`);
    setJustCopied(true);
    setTimeout(() => {
      setJustCopied(false);
    }, 1000);
  }, [doCopy, whom, writ]);

  const reply = useCallback(() => {
    useChatStore.getState().reply(whom, writ.seal.id);
  }, [writ, whom]);

  const navigate = useNavigate();
  return (
    <div className="absolute right-2 -top-5 z-10 flex space-x-0.5 rounded-lg border border-gray-100 bg-white p-[1px] align-middle opacity-0 group-one-hover:opacity-100">
      {/* <IconButton
        icon={<FaceIcon className="h-6 w-6 text-gray-400" />}
        label="React"
        showTooltip
        action={() => console.log('react')}
      /> */}
      {!writ.memo.replying && writ.memo.replying?.length !== 0 && !hideReply ? (
        <>
          {/*
          TODO: Add replies back in post-demo.
          <IconButton
            icon={<BubbleIcon className="h-6 w-6 text-gray-400" />}
            label="Reply"
            showTooltip
            action={reply}
          />

            */}
          <IconButton
            icon={<HashIcon className="h-6 w-6 text-gray-400" />}
            label="Start Thread"
            showTooltip
            action={() => navigate(`message/${writ.seal.id}`)}
          />
        </>
      ) : null}
      <IconButton
        icon={
          justCopied ? (
            <CheckIcon className="h-6 w-6 text-gray-400" />
          ) : (
            <CopyIcon className="h-6 w-6 text-gray-400" />
          )
        }
        label="Copy"
        showTooltip
        action={onCopy}
      />
      {/* <IconButton
        icon={<ShareIcon className="h-6 w-6 text-gray-400" />}
        label="Send to..."
        showTooltip
        action={() => console.log('send to..')}
      /> */}
      {window.our === writ.memo.author ? (
        <IconButton
          icon={<XIcon className="h-6 w-6 text-red" />}
          label="Delete"
          showTooltip
          action={onDelete}
        />
      ) : null}

      {/* <IconButton
        icon={<EllipsisIcon className="h-6 w-6 text-gray-400" />}
        label="More..."
        showTooltip
        action={() => console.log('More...')}
      /> */}
    </div>
  );
}
