import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppShell,
  Group,
  Title,
  ActionIcon,
  Container,
} from "@mantine/core";

export function Layout() {
  const location = useLocation();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
              <Title order={3}>小説ガチャ</Title>
            </Link>
            <Group gap="xs">
              {location.pathname !== "/generate" && (
                <Link to="/generate">
                  <ActionIcon variant="filled" size="lg" aria-label="新規生成">
                    +
                  </ActionIcon>
                </Link>
              )}
              <Link to="/settings">
                <ActionIcon variant="subtle" size="lg" aria-label="設定">
                  ⚙
                </ActionIcon>
              </Link>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
