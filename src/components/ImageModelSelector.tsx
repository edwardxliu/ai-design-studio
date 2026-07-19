import {
  IMAGE_MODEL_OPTIONS,
  type ImageModelChoice
} from "@/src/domain/generation-models";

type ImageModelSelectorProps = {
  value: ImageModelChoice;
  onChange: (value: ImageModelChoice) => void;
  disabled?: boolean;
  className?: string;
};

export function ImageModelSelector({
  value,
  onChange,
  disabled = false,
  className
}: ImageModelSelectorProps) {
  return (
    <label className={className} style={{ display: "grid", gap: 6, fontWeight: 700 }}>
      图像模型
      <select
        aria-label="图像模型"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ImageModelChoice)}
        value={value}
      >
        {IMAGE_MODEL_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
