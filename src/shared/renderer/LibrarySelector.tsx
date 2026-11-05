import { ChevronDown } from "lucide-react";
import { ChoiceMenu } from "./ChoiceMenu";
import { useTranslation } from "./LocalizationProvider";

export type LibraryKind = "audio" | "video";

/** Switch libraries through the title's disclosure button. */
export function LibrarySelector({ selected, onChange, disabled }: { selected: LibraryKind; onChange: (kind: LibraryKind) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  return <ChoiceMenu<LibraryKind> label={t("library.switch")} trigger={<ChevronDown size={13} />} selectedKey={selected} onChoose={onChange} disabled={disabled} className="ui-icon-button" menuWidth={160} choices={[{ key: "audio", label: t("library.title"), value: "audio" }, { key: "video", label: t("video.title"), value: "video" }]} />;
}
