-- Fix follow triggers (separate INSERT and DELETE)

DROP TRIGGER IF EXISTS on_follow_change ON follows;
DROP TRIGGER IF EXISTS on_follow_insert ON follows;
DROP TRIGGER IF EXISTS on_follow_delete ON follows;

CREATE TRIGGER on_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW
  WHEN (NEW.following_type = 'artist')
  EXECUTE FUNCTION sync_artist_follower_count();

CREATE TRIGGER on_follow_delete
  AFTER DELETE ON follows
  FOR EACH ROW
  WHEN (OLD.following_type = 'artist')
  EXECUTE FUNCTION sync_artist_follower_count();
