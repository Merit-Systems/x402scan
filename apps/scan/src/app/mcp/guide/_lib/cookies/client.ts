import { setCookie, deleteCookie } from 'cookies-next/client';

import { GUIDE_COOKIE_KEYS } from './keys';
import type { TaskKey } from '../../_types';

export const guideClientCookies = {
  setTask(task: TaskKey | null) {
    if (task) {
      setCookie(GUIDE_COOKIE_KEYS.SELECTED_TASK, task);
    } else {
      deleteCookie(GUIDE_COOKIE_KEYS.SELECTED_TASK);
    }
  },

  setCompletedLessons(lessons: string[]) {
    setCookie(GUIDE_COOKIE_KEYS.COMPLETED_LESSONS, JSON.stringify(lessons));
  },

  addCompletedLesson(lessonId: string, current: string[]) {
    if (!current.includes(lessonId)) {
      this.setCompletedLessons([...current, lessonId]);
    }
  },

  removeCompletedLesson(lessonId: string, current: string[]) {
    this.setCompletedLessons(current.filter(id => id !== lessonId));
  },

  setDismissedQuickStart(dismissed: boolean) {
    setCookie(GUIDE_COOKIE_KEYS.DISMISSED_QUICK_START, String(dismissed));
  },

  reset() {
    deleteCookie(GUIDE_COOKIE_KEYS.SELECTED_TASK);
    deleteCookie(GUIDE_COOKIE_KEYS.COMPLETED_LESSONS);
    deleteCookie(GUIDE_COOKIE_KEYS.DISMISSED_QUICK_START);
  },
};
