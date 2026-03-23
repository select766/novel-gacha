import { useState, useEffect } from "react";
import { Stack, TextInput, Button, Text, Alert } from "@mantine/core";
import { useSettings, useUpdateSettings } from "../api/client";

export function SettingsPage() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [ollamaUrl, setOllamaUrl] = useState("");

  useEffect(() => {
    if (settings?.ollamaUrl) {
      setOllamaUrl(settings.ollamaUrl);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({ ollamaUrl });
  };

  return (
    <Stack>
      <Text fw={600} size="xl">
        設定
      </Text>

      <TextInput
        label="Ollama URL"
        placeholder="http://localhost:11434"
        value={ollamaUrl}
        onChange={(e) => setOllamaUrl(e.currentTarget.value)}
      />

      <Button onClick={handleSave} loading={updateSettings.isPending} w={120}>
        保存
      </Button>

      {updateSettings.isSuccess && (
        <Alert color="green" variant="light">
          保存しました
        </Alert>
      )}
    </Stack>
  );
}
