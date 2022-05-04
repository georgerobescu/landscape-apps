import React from 'react';
import { UseFormRegister } from 'react-hook-form';

interface MetadataSchema {
  title: string;
  description: string;
  image: string;
}

export default function MetadataForm(props: {
  register: UseFormRegister<MetadataSchema>;
}) {
  const { register } = props;

  return (
    <div className="flex flex-col">
      <div className="p-2">
        <label htmlFor="title">Title</label>
        <input
          {...register('title')}
          className="rounded border"
          type="text"
          name="title"
        />
      </div>
      <div className="p-2">
        <label htmlFor="description">Description</label>
        <input
          {...register('description')}
          className="rounded border"
          type="text"
          name="description"
        />
      </div>
      <div className="p-2">
        <label htmlFor="description">Image</label>
        <input
          {...register('image')}
          className="rounded border"
          type="text"
          name="image"
        />
      </div>
    </div>
  );
}
