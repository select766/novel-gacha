import { Stack, Text, Loader, Center } from "@mantine/core";
import { Link } from "react-router-dom";
import { useGroups, useGenerationStatus } from "../api/client";
import { ActiveGenerationsBanner } from "../components/ActiveGenerationsBanner";
import { GroupCard } from "../components/GroupCard";

export function TopPage() {
  const { data: groups, isLoading } = useGroups();
  const { data: status } = useGenerationStatus(true);

  if (isLoading) {
    return (
      <Center mt="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <ActiveGenerationsBanner />

      {groups && groups.length === 0 && (
        <Center mt="xl">
          <Stack align="center" gap="sm">
            <Text c="dimmed" size="lg">
              まだ小説がありません
            </Text>
            <Link to="/generate">
              <Text c="blue">新規生成を始める →</Text>
            </Link>
          </Stack>
        </Center>
      )}

      {groups?.map((group) => (
        <Link
          key={group.id}
          to={`/groups/${group.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <GroupCard group={group} />
        </Link>
      ))}
    </Stack>
  );
}
