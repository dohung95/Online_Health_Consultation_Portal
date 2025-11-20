import './Css/AboutUs.css';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import Loading from './Loading';
function AboutUs() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Giả lập thời gian load trang (có thể thay bằng logic load data thực tế)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 giây

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }
  return (
    <>
    <div className='Background_AboutUs'>
      <div className='container'>
          <Navbar /> 
        </div>
    </div>
    </>
  );
}

export default AboutUs;