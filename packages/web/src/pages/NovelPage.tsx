import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Stack,
  Text,
  Badge,
  Card,
  Textarea,
  Button,
  Group,
  Loader,
  Center,
  NumberInput,
  Skeleton,
  Spoiler,
  Divider,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useUpdateNovel, useGenerate, useGroup } from "../api/client";
import { StarRating } from "../components/StarRating";
import type { NovelDetail } from "@novel-gacha/shared";

function NavigationBar({
  groupId,
  novelId,
  novels,
}: {
  groupId: string;
  novelId: string;
  novels: { id: string }[];
}) {
  // novels are in created_at DESC order from API, reverse for chronological index
  const sorted = [...novels].reverse();
  const currentIndex = sorted.findIndex((n) => n.id === novelId);
  const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const next =
    currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
  const label =
    currentIndex >= 0
      ? `#${currentIndex + 1} / ${sorted.length}`
      : `${sorted.length}件`;

  return (
    <Group justify="space-between">
      <div>
        {prev ? (
          <Link to={`/novels/${prev.id}`}>
            <Button variant="light" size="xs">
              ← 前 #{currentIndex}
            </Button>
          </Link>
        ) : (
          <Button variant="light" size="xs" disabled>
            ← 前
          </Button>
        )}
      </div>
      <Link to={`/groups/${groupId}`}>
        <Button variant="subtle" size="xs">
          一覧 ({label})
        </Button>
      </Link>
      <div>
        {next ? (
          <Link to={`/novels/${next.id}`}>
            <Button variant="light" size="xs">
              次 #{currentIndex + 2} →
            </Button>
          </Link>
        ) : (
          <Button variant="light" size="xs" disabled>
            次 →
          </Button>
        )}
      </div>
    </Group>
  );
}

export function NovelPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: novel, isLoading } = useQuery({
    queryKey: ["novels", id],
    queryFn: async () => {
      const res = await fetch(`/api/novels/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json() as Promise<NovelDetail>;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "generating" ? 3000 : false;
    },
  });
  const updateNovel = useUpdateNovel();
  const generate = useGenerate();

  // Fetch group to get sibling novels for navigation
  const { data: groupDetail } = useGroup(novel?.group_id || "");

  const [comment, setComment] = useState<string | null>(null);
  const [addCount, setAddCount] = useState<number>(1);

  if (isLoading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  if (!novel) {
    return (
      <Center mt="xl">
        <Text c="dimmed">小説が見つかりません</Text>
      </Center>
    );
  }

  const statusColor = {
    pending: "gray",
    generating: "blue",
    completed: "green",
    failed: "red",
  }[novel.status];

  const statusLabel = {
    pending: "待機中",
    generating: "生成中",
    completed: "完了",
    failed: "失敗",
  }[novel.status];

  const displayComment = comment ?? novel.comment ?? "";

  const handleRatingChange = (rating: number | null) => {
    updateNovel.mutate({ id: novel.id, data: { rating } });
  };

  const handleCommentSave = () => {
    updateNovel.mutate({
      id: novel.id,
      data: { comment: displayComment || null },
    });
  };

  const handleGenerateMore = async () => {
    await generate.mutateAsync({
      groupId: novel.group_id,
      model_name: novel.group.model_name,
      prompt: novel.group.prompt,
      system_prompt: novel.group.system_prompt ?? undefined,
      max_tokens: novel.group.max_tokens,
      temperature: novel.group.temperature ?? undefined,
      top_p: novel.group.top_p ?? undefined,
      count: addCount,
    });
    navigate("/");
  };

  const siblings = groupDetail?.novels ?? [];

  return (
    <Stack>
      {/* Navigation (top) */}
      <NavigationBar
        groupId={novel.group_id}
        novelId={novel.id}
        novels={siblings}
      />

      <Group justify="space-between">
        <Text fw={600} size="xl">
          {novel.group.title}
        </Text>
        <Badge color={statusColor}>{statusLabel}</Badge>
      </Group>

      <Group gap="md">
        <Text size="sm" c="dimmed">
          {novel.group.model_name}
        </Text>
        <Text size="sm" c="dimmed">
          {new Date(novel.created_at).toLocaleString("ja-JP")}
        </Text>
      </Group>

      {/* Prompt (collapsible) */}
      <Card padding="xs" radius="md" withBorder bg="gray.0">
        <Text size="xs" fw={500} c="dimmed" mb={4}>
          プロンプト
        </Text>
        <Spoiler maxHeight={24} showLabel="全文を表示" hideLabel="折りたたむ">
          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
            {novel.group.prompt}
          </Text>
          {novel.group.system_prompt && (
            <>
              <Divider my="xs" />
              <Text size="xs" fw={500} c="dimmed" mb={4}>
                システムプロンプト
              </Text>
              <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                {novel.group.system_prompt}
              </Text>
            </>
          )}
        </Spoiler>
      </Card>

      {/* Novel content */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {novel.status === "completed" && novel.content ? (
          <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
            {novel.content}
          </Text>
        ) : novel.status === "failed" ? (
          <Text c="red">エラー: {novel.error_message}</Text>
        ) : (
          <Stack>
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton height={16} width="70%" />
            <Text size="sm" c="dimmed" ta="center" mt="sm">
              {statusLabel}...
            </Text>
          </Stack>
        )}
      </Card>

      {/* Rating */}
      <Group>
        <Text size="sm" fw={500}>
          評価:
        </Text>
        <StarRating value={novel.rating} onChange={handleRatingChange} />
      </Group>

      {/* Comment */}
      <Textarea
        label="コメント"
        placeholder="感想やメモを入力..."
        value={displayComment}
        onChange={(e) => setComment(e.currentTarget.value)}
        minRows={2}
      />
      <Button size="xs" variant="light" onClick={handleCommentSave} w={120}>
        コメント保存
      </Button>

      {/* Actions */}
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group>
            <NumberInput
              value={addCount}
              onChange={(v) => setAddCount(typeof v === "number" ? v : 1)}
              min={1}
              max={100}
              w={80}
              size="xs"
            />
            <Button
              size="xs"
              onClick={handleGenerateMore}
              loading={generate.isPending}
            >
              同じ条件で追加生成
            </Button>
          </Group>
          <Link to={`/generate?fromGroup=${novel.group_id}`}>
            <Button size="xs" variant="outline">
              この条件で新規生成画面へ
            </Button>
          </Link>
        </Stack>
      </Card>

      {/* Navigation (bottom) */}
      <NavigationBar
        groupId={novel.group_id}
        novelId={novel.id}
        novels={siblings}
      />
    </Stack>
  );
}
