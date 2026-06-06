import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Button",
  },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "solid",
        "danger",
        "outline",
        "outlineMuted",
        "outlineDanger",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "icon", "sm", "md", "lg"],
    },
    shape: {
      control: "select",
      options: ["default", "pill"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    size: "md",
    shape: "default",
    children: "Primary",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger",
  },
};

export const Solid: Story = {
  args: {
    variant: "solid",
    children: "Confirm",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const OutlineMuted: Story = {
  args: {
    variant: "outlineMuted",
    size: "icon",
    children: "✓",
  },
};

export const OutlineDanger: Story = {
  args: {
    variant: "outlineDanger",
    size: "icon",
    children: "×",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Learn more →",
  },
};

export const LargePill: Story = {
  args: {
    variant: "primary",
    size: "lg",
    shape: "pill",
    children: "お世話を依頼する",
  },
};

export const SmallAction: Story = {
  args: {
    variant: "primary",
    size: "sm",
    children: "新規作成",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    children: "Disabled",
    disabled: true,
  },
};
