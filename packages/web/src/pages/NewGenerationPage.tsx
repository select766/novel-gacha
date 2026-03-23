import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Stack,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Slider,
  Button,
  Text,
  Collapse,
  Group,
  Alert,
} from "@mantine/core";
import { useOllamaModels, useGenerate, useGroup } from "../api/client";

export function NewGenerationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromGroupId = searchParams.get("fromGroup");

  const { data: modelsData, error: modelsError } = useOllamaModels();
  const { data: fromGroup } = useGroup(fromGroupId || "");
  const generate = useGenerate();

  const [title, setTitle] = useState("");
  const [modelName, setModelName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.9);
  const [count, setCount] = useState<number>(1);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pre-fill from existing group
  useEffect(() => {
    if (fromGroup) {
      setTitle("");
      setModelName(fromGroup.model_name);
      setPrompt(fromGroup.prompt);
      setSystemPrompt(fromGroup.system_prompt || "");
      setMaxTokens(fromGroup.max_tokens);
      if (fromGroup.temperature != null) setTemperature(fromGroup.temperature);
      if (fromGroup.top_p != null) setTopP(fromGroup.top_p);
    }
  }, [fromGroup]);

  const modelOptions =
    modelsData?.models?.map((m) => ({ value: m.name, label: m.name })) ?? [];

  const handleSubmit = async () => {
    await generate.mutateAsync({
      groupId: undefined,
      title: title || undefined,
      model_name: modelName,
      prompt,
      system_prompt: systemPrompt || undefined,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      count,
    });
    navigate("/");
  };

  return (
    <Stack>
      <Text fw={600} size="xl">
        新規生成
      </Text>

      {modelsError && (
        <Alert color="red" title="Ollamaに接続できません">
          設定ページでOllamaのURLを確認してください。
        </Alert>
      )}

      <TextInput
        label="タイトル"
        placeholder="空欄で自動生成"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
      />

      <Select
        label="モデル"
        placeholder="モデルを選択"
        data={modelOptions}
        value={modelName}
        onChange={(v) => setModelName(v || "")}
        searchable
        required
      />

      <Textarea
        label="プロンプト"
        placeholder="小説の指示を入力..."
        value={prompt}
        onChange={(e) => setPrompt(e.currentTarget.value)}
        minRows={4}
        autosize
        required
      />

      <Textarea
        label="システムプロンプト（任意）"
        placeholder="システムプロンプトを入力..."
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.currentTarget.value)}
        minRows={2}
        autosize
      />

      <Group>
        <Button
          variant="subtle"
          size="xs"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "▼ 詳細設定を閉じる" : "▶ 詳細設定"}
        </Button>
      </Group>

      <Collapse in={showAdvanced}>
        <Stack gap="sm">
          <NumberInput
            label="最大トークン数"
            value={maxTokens}
            onChange={(v) => setMaxTokens(typeof v === "number" ? v : 2048)}
            min={1}
            max={32768}
          />
          <div>
            <Text size="sm" mb={4}>
              Temperature: {temperature.toFixed(2)}
            </Text>
            <Slider
              value={temperature}
              onChange={setTemperature}
              min={0}
              max={2}
              step={0.05}
              marks={[
                { value: 0, label: "0" },
                { value: 1, label: "1" },
                { value: 2, label: "2" },
              ]}
            />
          </div>
          <div>
            <Text size="sm" mb={4}>
              Top P: {topP.toFixed(2)}
            </Text>
            <Slider
              value={topP}
              onChange={setTopP}
              min={0}
              max={1}
              step={0.05}
              marks={[
                { value: 0, label: "0" },
                { value: 0.5, label: "0.5" },
                { value: 1, label: "1" },
              ]}
            />
          </div>
        </Stack>
      </Collapse>

      <NumberInput
        label="生成数"
        value={count}
        onChange={(v) => setCount(typeof v === "number" ? v : 1)}
        min={1}
        max={100}
      />

      <Button
        size="lg"
        onClick={handleSubmit}
        loading={generate.isPending}
        disabled={!modelName || !prompt}
      >
        生成開始
      </Button>
    </Stack>
  );
}
