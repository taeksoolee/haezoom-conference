# ☀️ HAEZOOM SESSION 1

## Build For Simple Web
> 간단한 application을 빠르게 빌드할 수 있게 하는 라이브러리들을 몇가지 소개 합니다.

### 🙋 HTMX 
- 최근 복잡해진 프론트 엔드 (대표적으로 React) 개발을 간단하게 작성하기 위한 프로젝트 입니다. 최근 github accelerator에 선정되어 더 발전할 것으로 기대 합니다.
- core 기능은 jquery의 load와 유사하게 api html 조각을 전달받아 렌더링하는 기능을 제공하는 것입니다.
- 별도의 script 작성없이 html tag만으로 spa를 구현 가능합니다.
- 특정한 상황에서 React보다 더 나은 성능을 보입니다.
- 사용하기 위해 별도의 백엔드 서버(일반적인 json 형태의 서버와 다른)를 구축해야 하는 한계가 있습니다.
- 👀 사용 예시
  ```html
  <!-- load htmx -->
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>

  <!-- 페이지가 load되면 현재 태그에 /my-template 요청의 결과(html)를 렌더링 한다.  -->
  <div 
    hx-get="/my-template" 
    hx-trigger="load"
  ></div>
  ```

### 🙋 Alpinejs
- 👀 사용 예시
  ```html
  <!-- load alpinejs -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

  <!-- 버튼을 클릭하면 숫자가 올라간다. -->
  <div x-data="{count: 0}">
    <div x-text="count"></div>
    <button @click="count++">+</button>
  </div>
  ```

### 🙋 class-less css
> picocss, mvp.css