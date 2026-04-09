import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../nav-items';
import { GraduationCap, Menu, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* 添加点击事件到Logo和标题 */}
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">教育轻管家</span>
          </Link>
          
          {/* 桌面端导航菜单 */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  location.pathname === item.to
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
          
          {/* 移动端汉堡菜单按钮 */}
          <div className="md:hidden">
            <Dialog.Root open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <Dialog.Trigger asChild>
                <button 
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                  aria-label="菜单"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </Dialog.Trigger>
              
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
                <Dialog.Content className="fixed inset-y-0 right-0 w-64 bg-white shadow-lg z-50 flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b">
                    {/* 移动端菜单中的Logo和标题也添加点击事件 */}
                    <Link 
                      to="/" 
                      className="flex items-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                      <span className="text-lg font-bold text-gray-800">教育轻管家</span>
                    </Link>
                    <Dialog.Close asChild>
                      <button 
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                        aria-label="关闭菜单"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </Dialog.Close>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-2 space-y-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-3 rounded-md transition-colors ${
                            location.pathname === item.to
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {item.icon}
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
