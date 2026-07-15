import GitHubMark from "./GitHubMark";
import Reveal from "./Reveal";
import s from "./OpenSourceSection.module.css";

export default function OpenSourceSection() {
  return (
    <section className={`container ${s.section}`}>
      <Reveal>
        <div className={s.panel}>
          <div className={s.textCol}>
            <h2 className={s.title}>Бесплатно. Без подписок. С открытым клиентом.</h2>
            <p className={s.text}>
              Muza не берёт денег и не показывает рекламу. Музыку приложение
              находит само, прямо с твоего компьютера — аудио не проходит через
              наш сервер. Код клиента открыт: можно посмотреть, что внутри,
              собрать самому или предложить улучшение.
            </p>
          </div>
          <a
            className={`btn btn-surface ${s.repoBtn}`}
            href="https://github.com/EntonioDMI/muza-client"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubMark className={s.mark} />
            EntonioDMI/muza-client
          </a>
        </div>
      </Reveal>
    </section>
  );
}
