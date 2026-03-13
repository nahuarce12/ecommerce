export const formatMoney = (amount: number): string => {
  return amount.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
