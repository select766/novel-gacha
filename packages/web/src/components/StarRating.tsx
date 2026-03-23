import { Group, ActionIcon, Text } from "@mantine/core";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  readonly?: boolean;
}

export function StarRating({ value, onChange, readonly }: StarRatingProps) {
  return (
    <Group gap={2}>
      {[1, 2, 3, 4, 5].map((star) => (
        <ActionIcon
          key={star}
          variant="transparent"
          size="sm"
          onClick={() => {
            if (readonly) return;
            onChange(value === star ? null : star);
          }}
          style={{ cursor: readonly ? "default" : "pointer" }}
        >
          <Text size="lg" c={value != null && star <= value ? "yellow" : "gray"}>
            {value != null && star <= value ? "★" : "☆"}
          </Text>
        </ActionIcon>
      ))}
    </Group>
  );
}
