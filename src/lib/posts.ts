export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);

export const postUrl = (id: string) => `/posts/${id.split('/').map(encodeURIComponent).join('/')}/`;
