exports.futureDateGenerate = (hours) => {
  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return new Date(date);
};
