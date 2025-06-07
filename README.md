# 이미지 포맷 변환 실험 (Image Format Experiments)

이 프로젝트는 다양한 이미지 포맷(WebP, JPG, PNG 등)의 압축 효율과 성능을 실험하고, 그 결과를 체계적으로 기록하기 위해 만들어졌습니다.

## 🚀 사용법

1. **실험 초기화:**

   ```bash
   npm run init-experiment -- "새로운-실험-이름"
   ```

2. **이미지 변환:**

   ```bash
   npm run convert -- --path "01-white-image-test/image/original.png" --format webp --quality 80
   ```

3. **리포트 생성:**

   ```bash
   npm run generate-report -- --path "01-white-image-test"
   ```

4. **README 갱신:**
   ```bash
   npm run update-readme
   ```

## 🧪 실험 목록

| 번호 | 실험 이름        | 리포트                                  |
| :--- | :--------------- | :-------------------------------------- |
| 01   | White Image Test | [Link](./01-white-image-test/report.md) |
