const USER_TYPES = {
  REGULAR: "regular",
  PROFESSIONAL: "professional",
};

const ADMIN_USER_TYPES = {
  MAIN_ADMIN: "main_admin",
  EDITOR: "editor",
  ORDER_MANAGER: "order_manager",
};

const ADMIN_USER_STATUS = {
  PASSWORD_RESET_PENDING: "password_reset_pending",
};

const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  DELETED: "deleted",
  NOT_APPROVED: "not-approved",
};

const PRODUCT_PILLARS = {
  DETECT: "DETECT™",
  PREVENT: "PREVENT™",
  HEAL: "HEAL™",
};

const PRODUCT_CATEGORIES = {
  TWEAKZ: "Tweakz",
  ORAL_RELIEF: "Oral Relief",
};

module.exports = {
  USER_TYPES,
  USER_STATUS,
  ADMIN_USER_TYPES,
  ADMIN_USER_STATUS,
  PRODUCT_PILLARS,
  PRODUCT_CATEGORIES
};
