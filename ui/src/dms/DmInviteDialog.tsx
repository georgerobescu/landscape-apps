import React, { useState } from 'react';
import ob from 'urbit-ob';
import Dialog, { DialogContent } from '../components/Dialog';
import DMInviteInput, { Option } from './DMInviteInput';

interface DmInviteDialogProps {
  inviteIsOpen: boolean;
  setInviteIsOpen: (open: boolean) => void;
}

export default function DmInviteDialog({
  inviteIsOpen,
  setInviteIsOpen,
}: DmInviteDialogProps) {
  const [ships, setShips] = useState<Option[] | undefined>();
  const validShips = ships
    ? ships.every((ship) => ob.isValidPatp(ship.value))
    : false;

  const submitHandler = () => {
    if (validShips) {
      // TODO: how do we navigate to a multi-party DM?
      console.log({ ships });
      console.log('clicked add button');
    }
  };

  return (
    <Dialog open={inviteIsOpen} onOpenChange={setInviteIsOpen}>
      <DialogContent containerClass="w-full sm:max-w-lg" showClose>
        <div>
          <div className="flex flex-col">
            <h2 className="mb-4 text-lg font-bold">Invite to Chat</h2>
            <div className="w-full py-3 px-4">
              <DMInviteInput ships={ships} setShips={setShips} fromMulti />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button className="secondary-button">Cancel</button>
            <button
              disabled={!validShips}
              className="button"
              onClick={submitHandler}
            >
              Add
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
