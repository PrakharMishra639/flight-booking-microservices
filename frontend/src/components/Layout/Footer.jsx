import { PlaneTakeoff, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 text-white mb-4">
              <PlaneTakeoff className="h-6 w-6 text-primary" />
              <span className="text-lg font-heading font-bold">AeroFlow</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Experience the world with confidence and comfort. Book your flights seamlessly.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Flights</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Hotels</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Destinations</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>support@aeroflow.com</li>
              <li>+1 (555) 123-4567</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AeroFlow. All rights reserved.</p>
          <p className="mt-2 md:mt-0 flex items-center">
            Designed with <Heart className="h-3 w-3 mx-1 text-red-500" /> for travelers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
