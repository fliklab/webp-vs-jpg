---
name: "🧪 신규 실험 제안"
title: "feat(experiment): "
labels: "experiment"
---

## 🔬 실험 개요 (Experiment Overview)

<!--
어떤 실험을 제안하시는지 간략히 설명해주세요.
예: "그라데이션 이미지에서 WebP와 AVIF의 무손실 압축 효율 비교"
-->

### 🧐 가설 (Hypothesis)

<!--
이 실험을 통해 무엇을 증명하거나 확인하고 싶으신가요?
예: "복잡한 색상 정보를 가진 그라데-이션 이미지에서는 AVIF가 WebP보다 무손실 압축률이 더 높을 것이다."
-->

---

## 🖼️ 이미지 소스 (Image Source)

<!--
실험에 사용할 이미지의 정보를 기입해주세요. 이미지는 `samples/` 디렉토리에 위치해야 합니다.
-->

- **이미지 경로 (Image Path(s))**:
- **소스 설명 (Source Description)** (Optional):

---

## 🔁 변환 그룹 (Conversion Groups)

<!--
어떤 포맷과 옵션으로 변환을 테스트할지 정의해주세요. 필요한 만큼 그룹을 추가할 수 있습니다.
-->

### 그룹 1

- **변환 포맷 (Target Format)**:
- **변환 옵션 (Conversion Options)**:
- **결과 파일명 (Output Filename)**:

### 그룹 2

- **변환 포맷 (Target Format)**:
- **변환 옵션 (Conversion Options)**:
- **결과 파일명 (Output Filename)**:

---

## ✅ 체크리스트 (Checklist)

- [ ] `samples/` 디렉토리에 원본 이미지를 추가했습니다.
- [ ] `npm run init-experiment -- "실험 이름"`을 실행하여 실험 폴더를 생성했습니다.
- [ ] `npm run convert` 스크립트 또는 다른 도구를 사용하여 이미지를 변환하고 결과물을 추가했습니다.
- [ ] 생성된 실험 폴더의 `report.md` 파일에 결과를 작성했습니다.
- [ ] (Optional) 최상위 `README.md`의 실험 목록을 갱신했습니다.
