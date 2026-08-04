import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";
import { zh } from "../../i18n/locales/zh";
import SchemaBuilder from "./SchemaBuilder";

const nestedSchema = {
  type: "object",
  title: "Receipt input",
  properties: {
    order: {
      type: "object",
      properties: {
        id: { type: "string", description: "Order number" },
        total: { type: "number", minimum: 0 },
      },
      required: ["id"],
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "integer", minimum: 1 },
        },
      },
    },
  },
  required: ["order"],
} as const;

/**
 * A visual JSON Schema workspace with synchronized field and source editors.
 */
const meta = {
  title: "ui/patterns/JsonSchemaBuilder",
  component: SchemaBuilder,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    defaultValue: nestedSchema,
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SchemaBuilder>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The standard nested object and array editing experience. */
export const Default: Story = {};

/** Starts with an empty object schema ready for its first field. */
export const EmptySchema: Story = {
  args: {
    defaultValue: { type: "object", properties: {} },
  },
};

/** Fills a bounded application workspace and exposes the resizable split view. */
export const FillLayout: Story = {
  args: {
    layout: "fill",
    showFullscreenToggle: false,
    initialLeftPanelWidth: 55,
  },
  render: args => (
    <div className="h-162.5 w-[min(1100px,calc(100vw-3rem))]">
      <SchemaBuilder {...args} />
    </div>
  ),
};

/** Uses the built-in Simplified Chinese translation. */
export const ChineseLocale: Story = {
  args: {
    locale: zh,
  },
};

/** Displays schema details without allowing mutations. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
  },
};

export const ShouldRenderSplitWorkspace: Story = {
  name: "when the fill workspace opens, should show visual and JSON editors",
  tags: ["!dev", "!autodocs"],
  args: {
    layout: "fill",
    showFullscreenToggle: false,
    initialLeftPanelWidth: 55,
  },
  render: args => (
    <div className="h-162.5 w-225">
      <SchemaBuilder {...args} />
    </div>
  ),
  play: async ({ canvas, step }) => {
    await step("show both editing surfaces", async () => {
      await expect(canvas.getByRole("button", { name: "Add Field" })).toBeVisible();
      await expect(await canvas.findByText("JSON Schema Source")).toBeVisible();
    });
  },
};

export const ShouldCancelField: Story = {
  name: "when adding a field is canceled, should close without changing the schema",
  tags: ["!dev", "!autodocs"],
  args: {
    defaultValue: { type: "object", properties: {} },
    onChange: fn(),
  },
  play: async ({ canvas, canvasElement, step, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step("open and cancel the field dialog", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Add Field" }));
      const dialog = await body.findByRole("dialog");
      await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    });

    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};

export const ShouldAddField: Story = {
  name: "when a valid field is submitted, should emit the changed schema",
  tags: ["!dev", "!autodocs"],
  args: {
    defaultValue: { type: "object", properties: {} },
    onChange: fn(),
  },
  play: async ({ canvas, canvasElement, step, args }) => {
    const body = within(canvasElement.ownerDocument.body);

    await step("add a named string field", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Add Field" }));
      const dialog = await body.findByRole("dialog");
      await userEvent.type(within(dialog).getByLabelText("Field Name"), "customerName");
      await userEvent.click(within(dialog).getByRole("button", { name: "Add Field" }));
    });

    await expect(args.onChange).toHaveBeenCalled();
  },
};
