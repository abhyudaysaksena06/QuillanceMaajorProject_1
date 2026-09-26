export default function Avatar({ user, size = 36 }) {
  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return user?.avatar_url ? (
    <img className="avatar" src={user.avatar_url} alt={user.name} width={size} height={size} referrerPolicy="no-referrer" />
  ) : (
    <span className="avatar avatar-fallback" style={{ width: size, height: size }}>{initials}</span>
  );
}
