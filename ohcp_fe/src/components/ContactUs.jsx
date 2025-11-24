import './Css/ContactUs.css';
import { useState, useEffect } from 'react';
import Loading from './Loading';
function ContactUs() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập thời gian load trang (có thể thay bằng logic load data thực tế)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1.5 giây

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }
  return (
    <>
    <div className='Background_ContactUs'>
    </div>
    </>
  );
}

export default ContactUs;