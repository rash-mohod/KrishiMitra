import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:\\Users\\rashm\\OneDrive\\Desktop\\KM_4";
const skillDir = "C:\\Users\\rashm\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.909.11809\\skills\\presentations";
const buildDir = path.join(workspaceDir, ".pptx-build");
const finalPath = path.join(workspaceDir, "output", "KrishiMitra_Work_Done_Slide.pptx");
const { resolvePresentationFont, makeNativeBulletParagraphs, finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, "container_tools", "artifact_tool_utils.mjs")).href,
);

const font = resolvePresentationFont();
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const slide = presentation.slides.add();
slide.background.fill = "#F8F6EF";

function addBox({ left, top, width, height, fill = "none", line = { fill: "none", width: 0 }, geometry = "rect" }) {
  return slide.shapes.add({ geometry, position: { left, top, width, height }, fill, line });
}

function addText(text, left, top, width, height, style = {}) {
  const box = addBox({ left, top, width, height });
  box.text = text;
  box.text.style = {
    typeface: font,
    fontSize: 18,
    color: "#1F3529",
    autoFit: "shrinkText",
    verticalAlignment: "top",
    ...style,
  };
  return box;
}

function addBulletList(items, left, top, width, height) {
  const box = addBox({ left, top, width, height });
  box.text = makeNativeBulletParagraphs(items, {
    marginLeftPoints: 16,
    hangingPoints: 8,
    spaceAfterPoints: 5,
  });
  box.text.style = {
    typeface: font,
    fontSize: 17,
    color: "#20382B",
    autoFit: "shrinkText",
    verticalAlignment: "top",
  };
  return box;
}

// A flat agriculture-inspired palette supports the content without turning the slide into a dashboard.
addBox({ left: 0, top: 0, width: 1280, height: 18, fill: "#2F6A45" });
addBox({ left: 0, top: 18, width: 1280, height: 2, fill: "#C6A455" });
addBox({ left: 0, top: 636, width: 1280, height: 84, fill: "#274F37" });
addBox({ left: 1005, top: 20, width: 275, height: 616, fill: "#E7EFE5" });
addBox({ left: 1005, top: 20, width: 11, height: 616, fill: "#C6A455" });

addText("WORK DONE", 56, 50, 760, 58, {
  fontSize: 42,
  bold: true,
  color: "#1E5435",
});
addText("KrishiMitra | Farm-equipment rental marketplace", 58, 113, 810, 31, {
  fontSize: 20,
  color: "#5D6E62",
});
addBox({ left: 58, top: 160, width: 882, height: 2, fill: "#C6A455" });

addText("MARKETPLACE & USER EXPERIENCE", 58, 187, 420, 26, {
  fontSize: 15,
  bold: true,
  color: "#587245",
  charSpacing: 1.4,
});
addText("PLATFORM, OPERATIONS & QUALITY", 530, 187, 420, 26, {
  fontSize: 15,
  bold: true,
  color: "#587245",
  charSpacing: 1.2,
});
addBox({ left: 500, top: 185, width: 1, height: 420, fill: "#CBD8C6" });

addBulletList([
  "Responsive React and TypeScript frontend built with Vite and Tailwind CSS.",
  "Farmer, equipment owner and administrator roles with role-based access.",
  "Registration, login, authentication and protected routes.",
  "Equipment marketplace with search and filters for category, location, price, condition, dates and operator availability.",
  "Equipment details with images, specifications, daily pricing and availability.",
  "Full booking lifecycle: pending, accepted, active, completed, rejected and cancelled.",
  "Farmer and owner dashboards for equipment, bookings and rental activity.",
], 58, 226, 415, 385);

addBulletList([
  "Express and TypeScript REST APIs with Supabase PostgreSQL, authentication and storage.",
  "Real-time chat for farmers, owners and administrators.",
  "Notifications, favorites, equipment reviews, ratings and dispute management.",
  "Admin tools for platform statistics, dispute handling and system monitoring.",
  "Backend validation, Helmet security, CORS restrictions, rate limiting and role authorization.",
  "TypeScript validation, production builds, responsive UI checks and API endpoint testing.",
  "Stateless backend architecture prepared for future AWS-compatible cloud deployment.",
], 530, 226, 425, 385);

addText("KRISHIMITRA", 1050, 73, 190, 30, {
  fontSize: 18,
  bold: true,
  color: "#1E5435",
  alignment: "center",
  charSpacing: 1.5,
});
addText("Equipment access\nfor every farm", 1046, 144, 198, 87, {
  fontSize: 27,
  bold: true,
  color: "#1F4E32",
  alignment: "center",
  verticalAlignment: "middle",
});
addBox({ left: 1071, top: 263, width: 140, height: 3, fill: "#C6A455" });
addText("A digital marketplace\nconnecting local demand\nwith trusted machinery owners.", 1045, 295, 200, 95, {
  fontSize: 17,
  color: "#446451",
  alignment: "center",
  verticalAlignment: "middle",
});
addText("FARMER\n↕\nOWNER\n↕\nPLATFORM", 1064, 432, 164, 129, {
  fontSize: 19,
  bold: true,
  color: "#356447",
  alignment: "center",
  verticalAlignment: "middle",
  breakLine: false,
});

addText("Built for a secure, scalable equipment-rental experience across the agricultural ecosystem", 58, 662, 930, 25, {
  fontSize: 15,
  color: "#F5F2E8",
});
addText("PROJECT DELIVERY", 1032, 663, 190, 24, {
  fontSize: 13,
  bold: true,
  color: "#DCCB91",
  alignment: "right",
  charSpacing: 1.0,
});

slide.speakerNotes.textFrame.setText("KrishiMitra Work Done slide. Content supplied by the user. No external images or third-party facts used.");

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(path.dirname(finalPath), { recursive: true });
const candidatePath = path.join(buildDir, "KrishiMitra_Work_Done_Slide_draft.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

const requirements = {
  explicitTotalSlideCount: 1,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
await finalizePresentation({
  ...requirements,
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: "C:\\Users\\rashm\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe",
  integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-bullet-geometry", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [font] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, "KrishiMitra_Work_Done_Slide.validation.json"),
});

const preview = await presentation.export({ slide, format: "png", scale: 1.5 });
await fs.writeFile(path.join(buildDir, "KrishiMitra_Work_Done_Slide_preview.png"), new Uint8Array(await preview.arrayBuffer()));
console.log(finalPath);
