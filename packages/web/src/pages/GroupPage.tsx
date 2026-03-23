import { useParams, Link } from "react-router-dom";
import {
  Stack,
  Text,
  Card,
  Badge,
  Group,
  Loader,
  Center,
} from "@mantine/core";
import { useGroup } from "../api/client";
import { StarRating } from "../components/StarRating";
import type { NovelStatus } from "@novel-gacha/shared";

export function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const { data: group, isLoading } = useGroup(id || "");

  if (isLoading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  if (!group) {
    return (
      <Center mt="xl">
        <Text c="dimmed">グループが見つかりません</Text>
      </Center>
    );
  }

  const statusColor: Record<NovelStatus, string> = {
    pending: "gray",
    generating: "blue",
    completed: "green",
    failed: "red",
  };

  const statusLabel: Record<NovelStatus, string> = {
    pending: "待機中",
    generating: "生成中",
    completed: "完了",
    failed: "失敗",
  };

  return (
    <Stack>
      <Text fw={600} size="xl">
        {group.title}
      </Text>

      <Group gap="md">
        <Badge color="gray" variant="light">
          {group.model_name}
        </Badge>
        <Text size="sm" c="dimmed">
          {new Date(group.created_at).toLocaleString("ja-JP")}
        </Text>
      </Group>

      <Text size="sm" c="dimmed" mb="xs">
        {group.prompt}
      </Text>

      <Text fw={500} size="md">
        小説一覧 ({group.novels.length}件)
      </Text>

      {group.novels.map((novel, index) => (
        <Link
          key={novel.id}
          to={`/novels/${novel.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Card shadow="xs" padding="sm" radius="md" withBorder>
            <Group justify="space-between">
              <Group gap="sm">
                <Text size="sm" fw={500}>
                  #{index + 1}
                </Text>
                <Badge color={statusColor[novel.status]} size="sm">
                  {statusLabel[novel.status]}
                </Badge>
                {novel.status === "completed" && novel.content && (
                  <Text size="sm" c="dimmed" lineClamp={1} maw={400}>
                    {novel.content.slice(0, 80)}...
                  </Text>
                )}
              </Group>
              <Group gap="sm">
                <StarRating
                  value={novel.rating}
                  onChange={() => {}}
                  readonly
                />
                <Text size="xs" c="dimmed">
                  {new Date(novel.created_at).toLocaleString("ja-JP")}
                </Text>
              </Group>
            </Group>
          </Card>
        </Link>
      ))}
    </Stack>
  );
}
