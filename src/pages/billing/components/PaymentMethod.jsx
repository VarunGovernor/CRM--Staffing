import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PaymentMethod = ({ paymentMethod, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    billingAddress: ''
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: '',
      billingAddress: ''
    });
  };

  const handleSave = () => {
    console.log('Updating payment method:', formData);
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCardIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'visa':
        return 'CreditCard';
      case 'mastercard':
        return 'CreditCard';
      case 'amex':
        return 'CreditCard';
      default:
        return 'CreditCard';
    }
  };

  const maskCardNumber = (number) => {
    return `**** **** **** ${number?.slice(-4)}`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={20} className="text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Payment Method</h2>
            <p className="text-sm text-muted-foreground">Secure payment information</p>
          </div>
        </div>
        
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Icon name="Edit" size={16} className="mr-2" />
            Update
          </Button>
        )}
      </div>
      {!isEditing ? (
        <div className="space-y-4">
          {/* Current Payment Method */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-primary/10 rounded flex items-center justify-center">
                <Icon name={getCardIcon(paymentMethod?.type)} size={20} className="text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {paymentMethod?.type} {maskCardNumber(paymentMethod?.number)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Expires {paymentMethod?.expiry}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Check" size={16} className="text-success" />
              <span className="text-sm font-medium text-success">Verified</span>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-success/5 border border-success/20 rounded-lg">
              <Icon name="Lock" size={16} className="text-success" />
              <div>
                <div className="text-sm font-medium text-foreground">SSL Encrypted</div>
                <div className="text-xs text-muted-foreground">256-bit encryption</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-success/5 border border-success/20 rounded-lg">
              <Icon name="Shield" size={16} className="text-success" />
              <div>
                <div className="text-sm font-medium text-foreground">PCI Compliant</div>
                <div className="text-xs text-muted-foreground">Secure processing</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Card Number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData?.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e?.target?.value)}
              required
            />
            <Input
              label="Cardholder Name"
              type="text"
              placeholder="John Doe"
              value={formData?.name}
              onChange={(e) => handleInputChange('name', e?.target?.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              type="text"
              placeholder="MM/YY"
              value={formData?.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e?.target?.value)}
              required
            />
            <Input
              label="CVV"
              type="text"
              placeholder="123"
              value={formData?.cvv}
              onChange={(e) => handleInputChange('cvv', e?.target?.value)}
              required
            />
          </div>

          <Input
            label="Billing Address"
            type="text"
            placeholder="123 Main St, City, State 12345"
            value={formData?.billingAddress}
            onChange={(e) => handleInputChange('billingAddress', e?.target?.value)}
            required
          />

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Icon name="Save" size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;