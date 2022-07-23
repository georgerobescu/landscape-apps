import React, { useCallback, useEffect, useState } from 'react';
import { DragDropContext, DraggableLocation } from 'react-beautiful-dnd';
import bigInt from 'big-integer';
import { strToSym } from '@/logic/utils';
import { formatUv } from '@urbit/aura';
import { useGroupState, useRouteGroup } from '@/state/groups';
import { SectionMap } from './types';
import AdminChannelListSections from './AdminChannelListSections';
import ChannelManagerHeader from './ChannelManagerHeader';

interface AdminChannelListContentsProps {
  sectionedChannels: SectionMap;
}

export default function AdminChannelListDropContext({
  sectionedChannels,
}: AdminChannelListContentsProps) {
  const group = useRouteGroup();
  const [sections, setSections] = useState<SectionMap>({});
  const [orderedSections, setOrderedSections] = useState<string[]>([]);

  useEffect(() => {
    setSections(sectionedChannels);
    setOrderedSections(Object.keys(sectionedChannels));
  }, [sectionedChannels]);

  const onSectionEditNameSubmit = useCallback(
    (currentSectionKey: string, nextSectionTitle: string) => {
      const nextSections = sections;

      // if zone has no title, cancel edit
      if (!nextSectionTitle.length) {
        return;
      }

      nextSections[currentSectionKey].title = nextSectionTitle;
      nextSections[currentSectionKey].isNew = false;
      setSections({ ...nextSections });
    },
    [sections]
  );

  const onSectionDelete = useCallback(
    (currentSectionKey: string) => {
      const nextSections = sections;
      const nextOrderedSections = orderedSections;
      const orderedSectionsIndex = orderedSections.indexOf(currentSectionKey);

      nextSections.sectionless.channels =
        nextSections.sectionless.channels.concat(
          sections[currentSectionKey].channels
        );

      nextOrderedSections.splice(orderedSectionsIndex, 1);
      delete nextSections[currentSectionKey];

      setSections(nextSections);
      setOrderedSections(nextOrderedSections);
    },
    [orderedSections, sections]
  );

  const onChannelDelete = (channelFlag: string, sectionKey: string) => {
    const nextSections = sections;
    nextSections[sectionKey].channels = nextSections[
      sectionKey
    ].channels.filter((channel) => channel.key !== channelFlag);
    setSections(nextSections);
  };

  const addSection = () => {
    if (
      Object.keys(sections).filter((key) => sections[key].isNew === true).length
    ) {
      return;
    }
    const nextSection = {
      title: '',
      isNew: true,
      channels: [],
    };

    const nextSectionId = strToSym(formatUv(bigInt(Date.now())));
    const nextSections = {
      ...sections,
      [nextSectionId]: nextSection,
    };

    const nextOrderedSections = orderedSections;

    nextOrderedSections.splice(1, 0, nextSectionId);
    setSections(nextSections);
    setOrderedSections(nextOrderedSections);
  };

  const reorder = useCallback(
    (array: any[], sourceIndex: number, destinationIndex: number) => {
      const result = Array.from(array);
      const [removed] = result.splice(sourceIndex, 1);
      result.splice(destinationIndex, 0, removed);
      return result;
    },
    []
  );

  const setChannelZone = useCallback(
    async (channelFlag: string, zoneFlag: string, groupFlag: string) => {
      if (zoneFlag === 'Sectionless' || zoneFlag === '') {
        await useGroupState
          .getState()
          .removeChannelFromZone(groupFlag, channelFlag);
      } else {
        await useGroupState
          .getState()
          .addChannelToZone(zoneFlag, groupFlag, channelFlag);
      }
    },
    []
  );

  const reorderSectionMap = useCallback(
    (
      sectionMap: SectionMap,
      source: DraggableLocation,
      destination: DraggableLocation
    ) => {
      const current = [...sectionMap[source.droppableId].channels];
      const next = [...sectionMap[destination.droppableId].channels];
      const target = current[source.index];

      // move to same list
      if (source.droppableId === destination.droppableId) {
        const reordered = reorder(current, source.index, destination.index);
        const result: SectionMap = {
          ...sectionMap,
          [source.droppableId]: {
            title: sectionMap[source.droppableId].title,
            channels: reordered,
          },
        };
        return result;
      }

      // move to different list
      current.splice(source.index, 1);
      next.splice(destination.index, 0, target);
      const result: SectionMap = {
        ...sectionMap,
        [source.droppableId]: {
          title: sectionMap[source.droppableId].title,
          channels: current,
        },
        [destination.droppableId]: {
          title: sectionMap[destination.droppableId].title,
          channels: next,
        },
      };
      target.channel.zone = destination.droppableId;
      setChannelZone(target.key, destination.droppableId, group);
      return result;
    },
    [reorder, group, setChannelZone]
  );

  const onDragEnd = useCallback(
    (result) => {
      const { source, destination } = result;

      if (!destination) {
        return;
      }

      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      if (result.type === 'SECTIONS') {
        if (destination.index === 0) {
          return;
        }

        const newOrder = reorder(
          orderedSections,
          source.index,
          destination.index
        );
        setOrderedSections(newOrder);
        return;
      }

      const nextMap = reorderSectionMap(sections, source, destination);

      setSections(nextMap);
    },
    [orderedSections, reorder, reorderSectionMap, sections]
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <ChannelManagerHeader addSection={addSection} />
      <AdminChannelListSections
        sections={sections}
        orderedSections={orderedSections}
        onSectionEditNameSubmit={onSectionEditNameSubmit}
        onSectionDelete={onSectionDelete}
        onChannelDelete={onChannelDelete}
      />
    </DragDropContext>
  );
}
