import {X, ShieldCheck} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {FormProvider, useForm} from 'react-hook-form';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericInputField from '../Forms/Input/GenericInputField';

interface AddClientProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (clientData: any) => void;
}

interface ClientFormData {
  name: string;
  phone: string;
  city: string;
  address: string;
  gst: string;
  pan: string;
  aadhaar: string;
}

export default function AddClient({isOpen, onClose, onSave}: AddClientProps) {
  const methods = useForm<ClientFormData>({
    defaultValues: {
      name: '',
      phone: '',
      city: '',
      address: '',
      gst: '',
      pan: '',
      aadhaar: '',
    },
  });

  const {handleSubmit, reset} = methods;

  const onSubmit = (data: ClientFormData) => {
    console.log('Form Data:', data);

    if (onSave) {
      onSave(data);
    }

    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={handleClose}
            className="fixed inset-0 z-[60] bg-[#1a1a2e]/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.aside
            initial={{x: '100%'}}
            animate={{x: 0}}
            exit={{x: '100%'}}
            transition={{type: 'spring', damping: 25, stiffness: 200}}
            className="bg-surface border-outline-variant/20 fixed right-0 top-0 z-[70] flex h-screen w-[480px] flex-col border-l shadow-2xl"
          >
            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex h-full flex-col"
              >
                <div className="flex items-center justify-between border-b border-stroke bg-white p-8">
                  <div>
                    <h3 className="font-headline text-on-surface text-2xl font-black">
                      Add New Client
                    </h3>
                    <p className="text-on-surface-variant mt-1 text-xs uppercase tracking-widest">
                      Onboarding Workspace
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="hover:bg-surface-container border-outline-variant/30 flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto bg-white p-8">
                  {/* Personal Info Section */}
                  <section className="space-y-5">
                    <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#785600]">
                      Identity Information
                    </h4>

                    <GenericInputField
                      name="name"
                      label="Full Name"
                      placeholder="e.g. Ramesh Chandra"
                      required={true}
                      validation={{required: 'Full name is required'}}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <GenericInputField
                        name="phone"
                        label="Mobile Number"
                        placeholder="+91 00000 00000"
                        type="tel"
                        required={true}
                        validation={{required: 'Mobile number is required'}}
                      />
                      <GenericInputField
                        name="city"
                        label="City"
                        placeholder="Mumbai"
                        required={true}
                        validation={{required: 'City is required'}}
                      />
                    </div>

                    <GenericInputField
                      name="address"
                      label="Residential Address"
                      placeholder="Enter full address details..."
                      as="textarea"
                      rows={3}
                    />
                  </section>

                  {/* Legal Documents Section */}
                  <section className="space-y-5">
                    <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#785600]">
                      Compliance &amp; Taxation
                    </h4>

                    <GenericInputField
                      name="gst"
                      label="GST Number"
                      placeholder="27AAAAA0000A1Z5"
                      uppercase={true}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <GenericInputField
                        name="pan"
                        label="PAN Card"
                        placeholder="ABCDE1234F"
                        uppercase={true}
                      />
                      <GenericInputField
                        name="aadhaar"
                        label="Aadhaar Number"
                        placeholder="0000 0000 0000"
                      />
                    </div>
                  </section>

                  <section className="rounded-xl border border-primary/10 bg-primary/5 p-6">
                    <div className="flex items-start gap-4">
                      <ShieldCheck className="mt-1 h-6 w-6 text-primary" />
                      <div>
                        <h5 className="mb-1 text-sm font-bold text-primary">
                          Verify KYC Documents
                        </h5>
                        <p className="text-on-surface-variant text-xs leading-relaxed">
                          System will automatically validate GST and PAN against
                          government databases upon saving.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="flex gap-4 border-t border-stroke bg-white p-8">
                  <GenericButton type="submit" className="flex-1">
                    Save & Register Client
                  </GenericButton>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-[#d3c4af]/30 bg-[#eeeeec] px-8 py-4 font-bold text-[#45455b] transition-all hover:bg-[#e8e8e6]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </FormProvider>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
