import { Alert, Text, Progress, Group } from "@mantine/core";
import { useGenerationStatus } from "../api/client";

export function ActiveGenerationsBanner() {
  const { data } = useGenerationStatus(true);

  if (!data || data.active.length === 0) return null;

  const generating = data.active.filter((a) => a.status === "generating").length;
  const pending = data.active.filter((a) => a.status === "pending").length;

  return (
    <Alert variant="light" color="blue" mb="md" title="生成中">
      <Group gap="xs">
        <Text size="sm">
          生成中: {generating} / 待機中: {pending}
        </Text>
      </Group>
      <Progress
        value={generating > 0 ? 50 : 0}
        animated
        mt="xs"
        size="sm"
      />
    </Alert>
  );
}
