import Reveal from "./Reveal";
import s from "./CityScene.module.css";

/* «Кометы над городом» — единственный крупный арт-момент лендинга
   (Recraft, плоская сцена в палитре токенов), отсылка к демо-треку мокапа. */

export default function CityScene() {
  return (
    <div className={`container ${s.wrap}`} aria-hidden="true">
      <Reveal>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/comets-city.webp" alt="" className={s.img} loading="lazy" />
      </Reveal>
    </div>
  );
}
