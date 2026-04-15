import type { DeliveryOrderLine } from '../constants/app'

export function createEmptyDeliveryOrderLine(defaultProduct: string, defaultSize: string): DeliveryOrderLine {
  return {
    productType: defaultProduct,
    sizeLabel: defaultSize,
  }
}

export function formatDeliveryOrderSummary(lines: DeliveryOrderLine[]) {
  return lines
    .filter((line) => line.productType.trim() && line.sizeLabel.trim())
    .map((line) => `${line.productType} :: ${line.sizeLabel}`)
    .join(' | ')
}

export function formatDeliveryLabel(value: string) {
  return value.split(' | ').join(', ').replaceAll(' :: ', ' - ')
}
