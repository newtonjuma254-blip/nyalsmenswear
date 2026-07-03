
revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;
revoke execute on function public.handle_new_user_admin() from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;
