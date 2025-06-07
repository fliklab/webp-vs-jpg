# 이미지 포맷 변환 실험 (Image Format Experiments)

이 프로젝트는 다양한 이미지 포맷(WebP, JPG, PNG 등)의 압축 효율과 성능을 실험하고, 그 결과를 체계적으로 기록하기 위해 만들어졌습니다.

## 🚀 새로운 실험 추가 방법 (완전 자동화)

새로운 이미지 변환 실험을 추가하는 과정은 이제 **완전 자동화**되었습니다. 아래의 간단한 절차를 따라주세요.

1.  **실험할 이미지 추가**:

    - `sources` 디렉토리에 변환을 테스트할 원본 이미지를 추가합니다.

2.  **Pull Request 생성**:

    - 방금 추가한 이미지를 commit하고 push한 후, `main` 브랜치로 Pull Request(PR)를 생성합니다.
    - **PR 제목**은 `feat: [나의 실험 이름]` 형식으로 작성해주세요. 예: `feat: 풍경 사진 WebP 압축률 테스트`
    - PR 본문은 자동으로 나타나는 템플릿에 맞춰 간단하게 작성합니다.

3.  **자동화 실행 확인**:

    - PR을 생성하면 **GitHub Actions**가 자동으로 나머지 모든 과정을 처리합니다.
    - ✅ 실험 폴더 생성
    - ✅ 원본 이미지 이동
    - ✅ WebP 및 JPG 변환 (기본 품질 80)
    - ✅ 결과 리포트(`report.md`) 생성
    - ✅ 메인 `README.md`의 실험 목록 업데이트
    - 자동화 봇이 생성한 파일들을 PR에 추가로 commit해줄 때까지 잠시 기다려주세요.

4.  **결과 리뷰**:
    - 모든 과정이 완료되면 PR에서 변환된 이미지의 품질과 리포트의 내용을 확인하고 Merge합니다.

## 🧪 실험 목록

<!-- EXPERIMENT_LIST_START -->

| 번호 | 실험 이름           | 리포트                                     |
| :--- | :------------------ | :----------------------------------------- |
| 01   | White Image Test    | [Link](./01-white-image-test/report.md)    |
| 02   | Text Rendering Test | [Link](./02-text-rendering-test/report.md) |

<!-- EXPERIMENT_LIST_END -->
