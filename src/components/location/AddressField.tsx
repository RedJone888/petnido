import { useLocationController } from "@/hooks/useLocationController";
import LocationInput from "@/components/location/LocationInput";
import MapLibreMap from "@/components/location/MapLibreMap";
import CurrencySelect from "@/components/location/CurrencySelect";
import cn from "@/lib/cn";
import { useLanguage } from "@/components/providers/language-provider";
interface AddressInputProps {
  controller: ReturnType<typeof useLocationController>;
  inputId?: string;
  placeholder?: string;
  className?: string;
}
// 专门负责搜索输入和展示结果
export const AddressInput = ({
  controller,
  inputId,
  className = "",
  placeholder,
}: AddressInputProps) => {
  const { t } = useLanguage();
  const copy = t.location;
  const {
    source,
    queryLabel,
    searchResults,
    isSearchLoading,
    isReverseLoading,
    setBySearch,
    onInputChange,
  } = controller;
  return (
    <div className="relative w-full">
      <LocationInput
        inputId={inputId}
        value={queryLabel}
        source={source}
        disabled={isReverseLoading}
        results={searchResults}
        loading={isSearchLoading}
        onSearchSelect={setBySearch}
        onInputChange={onInputChange}
        placeholder={placeholder || copy.mapSelection}
        className={className} // 这里传入自定义样式
      />

      {/* 可以在这里统一处理 Loading 状态的小图标 */}
      {isReverseLoading && (
        <div className="absolute rounded-full left-24 top-1/2 -translate-y-1/2 border-t border-r w-3 h-3 animate-spin"></div>
      )}
    </div>
  );
};
interface AddressMapProps {
  controller: ReturnType<typeof useLocationController>;
  className?: string;
  height?: string;
  showPrivacyRadius?: boolean;
}
export const AddressMap = ({
  controller,
  height = "h-64",
  className,
  showPrivacyRadius,
}: AddressMapProps) => {
  const { location, setByMap } = controller;
  return (
    <div className={cn("w-full rounded-xl overflow-hidden", height, className)}>
      <MapLibreMap
        lat={location.lat}
        lon={location.lon}
        onLocationChange={setByMap}
        showPrivacyRadius={showPrivacyRadius}
        // 可以在这里传一个 zoom 属性，寄养模式给 12，上门模式给 15
      />
    </div>
  );
};
interface AddressCurrencyProps {
  controller: ReturnType<typeof useLocationController>;
  disabled?: boolean;
  size?: number;
  triggerClass?: string;
  dorpdownClass?: string;
  commonClass?: string;
  flagClass?: string;
}
export const AddressCurrencySelect = ({
  controller,
  disabled,
  size = 16,
  triggerClass = "",
  dorpdownClass = "",
  commonClass = "",
  flagClass = "",
}: AddressCurrencyProps) => {
  const { currency, onCurrencyChange } = controller;
  return (
    <CurrencySelect
      currency={currency}
      onChange={onCurrencyChange}
      disabled={disabled}
      size={size}
      triggerClass={triggerClass}
      dorpdownClass={dorpdownClass}
      commonClass={commonClass}
      flagClass={flagClass}
    />
  );
};
