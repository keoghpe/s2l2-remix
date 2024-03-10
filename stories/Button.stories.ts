import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';
import { AlbumTile } from '../app/components/AlbumTile';
import { createRemixStub } from '@remix-run/testing';


// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'AlbumTile',
  component: AlbumTile,
  decorators: [
    (story) => {
      const remixStub = createRemixStub([
        {
          path: "/*",
          action: () => ({ redirect: "/" }),
          loader: () => ({ redirect: "/" }),
          Component: () => story(),
        },
      ]);

      return remixStub({ initialEntries: ["/"] });
    },
  ],
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    // layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
} satisfies Meta<typeof AlbumTile>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    albumName: "Discovery",
    artistName: "Daft Punk",
    imageUrl: "https://i.scdn.co/image/ab67616d0000b27348905438b9c1153978d9fbf4",
    notesUrl: "/"
  },
};

// export const Secondary: Story = {
//   args: {
//     label: 'Button',
//   },
// };

// export const Large: Story = {
//   args: {
//     size: 'large',
//     label: 'Button',
//   },
// };

// export const Small: Story = {
//   args: {
//     size: 'small',
//     label: 'Button',
//   },
// };
