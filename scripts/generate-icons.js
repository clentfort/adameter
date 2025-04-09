// This is a Node.js script that would generate icons from the SVG
// For the purpose of this example, we'll just create placeholder files

const fs = require("node:fs")
const path = require("node:path")
const { createCanvas } = require("canvas")

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, "../public/icons")
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Sizes for the icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

// Also create an Apple icon
sizes.push(180)

// Generate a simple colored square for each size
sizes.forEach((size) => {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")

  // Draw background
  ctx.fillStyle = "#6366f1"
  ctx.fillRect(0, 0, size, size)

  // Draw circles representing breasts
  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 6

  // Left breast (blue)
  ctx.fillStyle = "#a5b4fc"
  ctx.beginPath()
  ctx.arc(centerX - radius, centerY, radius, 0, 2 * Math.PI)
  ctx.fill()

  // Right breast (pink)
  ctx.fillStyle = "#ec4899"
  ctx.beginPath()
  ctx.arc(centerX + radius, centerY, radius, 0, 2 * Math.PI)
  ctx.fill()

  // Draw dividing line
  ctx.strokeStyle = "white"
  ctx.lineWidth = size / 32
  ctx.beginPath()
  ctx.moveTo(centerX, centerY - radius)
  ctx.lineTo(centerX, centerY + radius)
  ctx.stroke()

  // Save the file
  const fileName = size === 180 ? "apple-icon-180x180.png" : `icon-${size}x${size}.png`
  const out = fs.createWriteStream(path.join(iconsDir, fileName))
  const stream = canvas.createPNGStream()
  stream.pipe(out)
})

console.log("Icons generated successfully!")

