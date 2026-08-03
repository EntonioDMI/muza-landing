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
            {/* Формулировку пришлось разделить по платформам: «аудио не
                проходит через наш сервер» верно только для приложения. Веб —
                которым страница и зовёт пользоваться главной кнопкой — играет
                байтами с сервера (muza-server, resolver.controller.ts: ручка
                потока отдаёт файл сама). Обещать одно на двоих было нельзя. */}
            <p className={s.text}>
              Muza не берёт денег и не показывает рекламу. В приложении музыка
              играет прямо с твоего компьютера — через наш сервер она не
              проходит. В браузере иначе: там звук отдаёт сервер Muza. Код
              клиента открыт: можно посмотреть, что внутри, собрать самому или
              предложить улучшение.
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
