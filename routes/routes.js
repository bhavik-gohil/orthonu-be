const express = require("express");
const router = express.Router();

const productRouter = require("./product");
const productCategoryRouter = require("./productCategory");
const adminRouter = require("./adminUser");
const publicRouter = require("./public");
const cartRouter = require("./cart");
const userAuthRouter = require("./userAuth");
const colorsRouter = require("./colors");
const formsRouter = require("./forms");
const uploadRouter = require("./upload");
const testimonialsRouter = require("./testimonials");
const boardMembersRouter = require("./boardMembers");
const partnersRouter = require("./partners");
const couponsRouter = require("./coupons");

const productGroupsRouter = require("./productGroups");

const authMiddleware = require("../middleware/authMiddleware");
const { mainAdminOnly } = require("../middleware/roleMiddleware");

router.get("/", async (req, res) => {
  res.json("Ok");
});

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES — no authentication required
// ═══════════════════════════════════════════════════════════════════════════════

router.use("/auth", userAuthRouter);
router.use("/api/forms", formsRouter);

// Public read-only: categories, colors, about-page content
router.get(
  "/product-categories",
  require("../controllers/productCategory/productCategory").getProductCategory
);
router.get("/colors", require("../controllers/colorsController").getAllColors);
router.get("/testimonials", require("../controllers/testimonialController").getTestimonials);
router.get("/board-members", require("../controllers/boardMemberController").getBoardMembers);
router.get("/partners", require("../controllers/partnerController").getPartners);

// Public: product groups with their products (for home page)
router.get("/shop/product-groups", require("../controllers/productGroupController").getGroupsWithProducts);

// ═══════════════════════════════════════════════════════════════════════════════
// SHOP ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

router.use("/shop", publicRouter);
router.use("/cart", cartRouter);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — authentication required
// ═══════════════════════════════════════════════════════════════════════════════

router.use("/admin", adminRouter);

// Products & categories — main_admin only
router.use("/admin/products", authMiddleware, mainAdminOnly, productRouter);
router.use("/admin/product-categories", authMiddleware, mainAdminOnly, productCategoryRouter);
router.use("/admin/colors", authMiddleware, mainAdminOnly, colorsRouter);
router.use("/admin/upload", authMiddleware, mainAdminOnly, uploadRouter);
router.use("/admin/product-groups", productGroupsRouter);

// About-page content — main_admin + editor
router.use("/admin/testimonials", testimonialsRouter);
router.use("/admin/board-members", boardMembersRouter);
router.use("/admin/partners", partnersRouter);

// Coupons — public validate + admin CRUD
router.use("/coupons", couponsRouter);
router.use("/admin/coupons", couponsRouter);

module.exports = router;
