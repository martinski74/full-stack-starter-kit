export const categoryColors = [
  'bg-red-100 text-red-800',
  'bg-orange-100 text-orange-800',
  'bg-amber-100 text-amber-800',
  'bg-yellow-100 text-yellow-800',
  'bg-lime-100 text-lime-800',
  'bg-green-100 text-green-800',
  'bg-emerald-100 text-emerald-800',
  'bg-teal-100 text-teal-800',
  'bg-cyan-100 text-cyan-800',
  'bg-sky-100 text-sky-800',
  'bg-blue-100 text-blue-800',
  'bg-indigo-100 text-indigo-800',
  'bg-violet-100 text-violet-800',
  'bg-purple-100 text-purple-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-pink-100 text-pink-800',
  'bg-rose-100 text-rose-800',
  'bg-warmgray-100 text-warmgray-800',
  'bg-truegray-100 text-truegray-800',
  'bg-gray-100 text-gray-800',
  'bg-coolgray-100 text-coolgray-800',
  'bg-bluegray-100 text-bluegray-800',
];

export const getCategoryColor = (categoryId: number) => {
  return categoryColors[categoryId % categoryColors.length];
};
