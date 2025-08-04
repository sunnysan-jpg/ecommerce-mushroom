const razorpayInstance = require("../config/payment.config");
const crypto = require('crypto');


const createPayment = async (req,res)=>{
  try {
   const { amount } = req.body;

    const options = {
      amount: amount , // Razorpay works in paise
      currency: "INR",
      payment_capture: 1,  
      method: "upi",
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}   


const verifyPayment = async (req,res)=>{
  try {
      const secret = process.env.RAZORPAY_KEY_SECRET;
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    return res.status(200).json({ success: true, message: "Payment verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Payment verification failed" });
  }
    
  } catch (error) {
      console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}


module.exports = {createPayment,verifyPayment}