import { Card, Text, Badge, Group, Stack } from "@mantine/core";
import { Link } from "react-router-dom";
import type { GroupSummary } from "@novel-gacha/shared";

interface GroupCardProps {
  group: GroupSummary;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Card shadow="sm" padding="md" radius="md" withBorder mb="sm">
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="lg">
          {group.title}
        </Text>
        <Badge color="gray" variant="light">
          {group.model_name}
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" lineClamp={2} mb="xs">
        {group.prompt}
      </Text>

      <Group gap="md">
        <Text size="sm">
          {group.completed_count}/{group.novel_count} 完了
        </Text>
        {group.avg_rating != null && (
          <Text size="sm" c="yellow">
            ★ {group.avg_rating.toFixed(1)}
          </Text>
        )}
        <Text size="xs" c="dimmed">
          {new Date(group.created_at).toLocaleDateString("ja-JP")}
        </Text>
      </Group>

      <Group mt="xs" gap="xs" style={{ flexWrap: "wrap" }}>
        {Array.from({ length: Math.min(group.novel_count, 10) }).map(
          (_, i) => (
            <Badge key={i} size="xs" variant="dot" color="teal">
              #{i + 1}
            </Badge>
          )
        )}
        {group.novel_count > 10 && (
          <Text size="xs" c="dimmed">
            ...他{group.novel_count - 10}件
          </Text>
        )}
      </Group>
    </Card>
  );
}
