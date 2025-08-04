const razorpayInstance = require("../config/payment.config");



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


module.exports = createPayment