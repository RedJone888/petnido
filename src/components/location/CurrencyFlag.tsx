import ReactCountryFlag from "react-country-flag";
import { CURRENCY_META } from "@/domain/location/constants";
import cn from "@/lib/cn";
type Props = {
  currency: keyof typeof CURRENCY_META;
  size?: number;
  className?: string;
};
export default function CurrencyFlag({
  currency,
  size = 16,
  className = "",
}: Props) {
  const meta = CURRENCY_META[currency];

  if (!meta?.countryCode) return null;

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <ReactCountryFlag
        svg
        countryCode={meta.countryCode}
        style={{
          width: size,
          height: size,
        }}
      />
      <span>{meta.label.ja.long}</span>
      <span className="text-muted-foreground">({meta.currency})</span>
    </span>
  );
}
