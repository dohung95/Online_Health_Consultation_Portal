import { useState, useEffect } from 'react';
import './Css/Home.css';
import Navbar from './Navbar';
import Loading from './Loading';

function Home() {
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
    <div className="Background_Home" >
       <div className='container'>
          <Navbar />
        </div>

    </div>
  );
}

export default Home;