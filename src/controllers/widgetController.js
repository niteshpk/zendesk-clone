// /src/controllers/widgetController.js
const prisma = require('../db'); // Prisma client

exports.createWidget = async (req, res) => {
  const { tenantId, color, welcomeText, widgetTitle, logoUrl } = req.body;

  try {
    // Either create new or update existing widget
    const existing = await prisma.widget.upsert({
      where: { tenantId },
      update: { color, welcomeText, widgetTitle, logoUrl },
      create: { tenantId, color, welcomeText, widgetTitle, logoUrl }
    });

    console.log('Widget saved:', existing);
    res.redirect('/tenant-dashboard.html');
  } catch (err) {
    console.error('Error creating widget config:', err);
    res.status(500).send('Failed to save widget config');
  }
};

exports.getWidgetConfig = async (req, res) => {
  const tenantId = req.params.tenantId;

  try {
    const config = await prisma.widget.findFirst({ where: { tenantId } });

    if (config) {
      res.json(config);
    } else {
      res.json({
        tenantId,
        color: '#000000',
        widgetTitle: 'Support Chat',
        welcomeText: 'Welcome!',
        logoUrl: '',
      });
    }
  } catch (err) {
    console.error('Error fetching widget config:', err);
    res.status(500).send('Failed to fetch widget config');
  }
};

exports.saveWidget =  async (req, res) => {
  const { tenantId, widgetTitle, welcomeText, logoUrl, color } = req.body;

  const existingWidget = await prisma.widget.findFirst({
    where: { tenantId }
  });

  if (existingWidget) {
    await prisma.widget.update({
      where: { id: existingWidget.id },
      data: { widgetTitle, welcomeText, logoUrl, color }
    });
  } else {
    await prisma.widget.create({
      data: {
        tenantId,
        widgetTitle,
        welcomeText,
        logoUrl,
        color
      }
    });
  }
  res.json({ success: true });
};