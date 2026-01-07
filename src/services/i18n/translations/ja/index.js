import { common } from './common';
import { auth } from './auth';
import { home } from './home';
import { messages } from './messages';
import { notifications } from './notifications';
import { chat } from './chat';
import { onboarding } from './onboarding';
import { profile } from './profile';
import { settings } from './settings';
import { help } from './help';
import { compose } from './compose';
import { edit_profile } from './editProfile';
import { post_actions } from './postActions';
import { user_actions } from './userActions';
import { profile_stats } from './profileStats';
import { general } from './general';

export const ja = {
  common,
  ...auth,
  ...home,
  ...messages,
  ...notifications,
  ...chat,
  onboarding,
  profile,
  settings,
  help,
  compose,
  edit_profile,
  post_actions,
  user_actions,
  profile_stats,
  general,
};
