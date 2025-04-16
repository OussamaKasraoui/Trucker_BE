const EmailHelpers = require('../helpers/email.helper');
const validateEmailInput = require('../validation/email'); // Assuming you have a validation file for email

exports.create = async function (req, res) {
  // Check if request body is empty
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: true, message: 'Field required', data: req.body });
  }

  // Form validation (assuming validateEmailInput validates req.body)
  const { errors, isValid } = validateEmailInput(req.body);

  if (!isValid) {
    return res.status(400).json({ error: true, message: "Validation failed", data: errors.map(element => {
      if(element.isValid) return {}
      if(!element.isValid) return element.errors
  }) });
  }

  try {
    // Create Email using the helper function
    const emailCreationResult = await EmailHelpers.create({
      subject: req.body.subject,
      body: req.body.body,
      recipient: req.body.recipient,
      sender: req.body.sender || 'system',
      status: 'pending',
      sentAt: req.body.sentAt || null,
      scheduledAt: req.body.scheduledAt || null,
      retryCount: req.body.retryCount || 0,
      attachments: req.body.attachments || []
    });

    // Handle email creation errors
    if (emailCreationResult.error) {
      return res.status(500).json({ error: true, message: emailCreationResult.payload, data: emailCreationResult.payload });
    }

    // Return successful response
    return res.status(200).json({ error: false, message: "Email created successfully", data: emailCreationResult.payload });

  } catch (err) {
    console.error("Error in email creation process:", err);
    return res.status(500).json({ error: true, message: "Internal server error", data: err.message });
  }
};
