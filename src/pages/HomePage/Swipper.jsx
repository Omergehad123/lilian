import React, { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useLanguage } from "../../hooks/useLanguage"; // Import useLanguage hook

const images = [
  "https://res.cloudinary.com/dbfty465x/image/upload/v1767728346/hero-1_hzbbcw.jpg",
  "https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/hero-6_nml2zi.jpg",
  "https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/hero-3_wdbpio.jpg",
  "https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/hero-4_hpo0tr.jpg",
  "https://res.cloudinary.com/dbfty465x/image/upload/v1767728347/hero-5_efzbuf.jpg",
];

function Swipper() {
  // Obtain language, so Swipper will remount when language changes
  const { language } = useLanguage();

  // Use useMemo to memoize images array (not strictly necessary, but explicit)
  const memoizedImages = useMemo(() => images, []);

  return (
    <div className="w-full" style={{ height: "70vh" }}>
      <Swiper
        key={language} // Force remount & reset swiper on language change to fix disappearing images
        modules={[Autoplay]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={true}
        slidesPerView={1}
        className="lg:w-[60%] h-full"
        style={{ height: "100%" }}
      >
        {memoizedImages.map((image, idx) => (
          <SwiperSlide key={idx}>
            <div
              className="mx-auto lg:w-1/2 w-[95%] h-[80vh] bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${image})` }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default Swipper;
